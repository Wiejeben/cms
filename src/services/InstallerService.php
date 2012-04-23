<?php
namespace Blocks;

/**
 *
 */
class InstallerService extends Component
{
	/**
	 * Run the installer
	 */
	public function run()
	{
		if (b()->isInstalled)
			throw new Exception('Blocks is already installed.');

		// Create the languages table first
		// This is a special case: So that other tables' language columns
		// can be restricted to supported languages without making them enums
		$table = b()->config->tablePrefix.'languages';
		$columns = array('language' => 'CHAR(5) NOT NULL PRIMARY KEY');
		b()->db->createCommand()->setText(b()->db->schema->createTable($table, $columns))->execute();

		// Add the languages
		b()->db->createCommand()->insert('languages', array('language' => 'en_us'));

		// Install the Block model first so the other models can create FK's to it
		$models[] = new Block;

		$modelsDir = b()->file->set(b()->path->modelsPath);
		$modelFiles = $modelsDir->getContents(false, '.php');

		foreach ($modelFiles as $filePath)
		{
			$file = b()->file->set($filePath);
			$fileName = $file->fileName;

			// Ignore Block since that's already queued up,
			// and the abstract models
			if (in_array($fileName, array('Block', 'ActiveRecord', 'Model')))
				continue;

			$class = __NAMESPACE__.'\\'.$fileName;
			$obj = new $class;

			if (method_exists($obj, 'createTable'))
				$models[] = $obj;
		}

		// Start the transaction
		$transaction = b()->db->beginTransaction();
		try
		{
			// Create the tables
			foreach ($models as $model)
			{
				$model->createTable();
			}

			// Create the foreign keys
			foreach ($models as $model)
			{
				$model->addForeignKeys();
			}

			// Tell Blocks that it's installed now
			b()->isInstalled = true;

			// Populate the info table
			$info = new Info;
			$info->edition = Blocks::getEdition(false);
			$info->version = Blocks::getVersion(false);
			$info->build = Blocks::getBuild(false);
			$info->save();

			$transaction->commit();
		}
		catch (Exception $e)
		{
			$transaction->rollBack();
			throw $e;
		}
	}
}
